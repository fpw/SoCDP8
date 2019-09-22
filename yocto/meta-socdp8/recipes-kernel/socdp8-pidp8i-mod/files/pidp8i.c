#include <linux/module.h>
#include <linux/device.h>
#include <linux/platform_device.h>
#include <linux/of_platform.h>
#include <linux/io.h>
#include <linux/uio_driver.h>

static struct uio_info console_uio = {
    .name = "pidp8i_console",
    .version = "0.1",
    .irq = UIO_IRQ_NONE,
};

static int __init pidp8_probe(struct platform_device *pdev) {
    struct device *dev = &pdev->dev;
    struct resource *rsrc;
    void __iomem *addr;
    int res;
    
    dev_info(dev, "PiDP-8/I console driver probed\n");
    
    rsrc = platform_get_resource(pdev, IORESOURCE_MEM, 0);
    if (!rsrc) {
        dev_err(dev, "No memory region specified\n");
        return -EINVAL;
    }
        
    addr = devm_ioremap(dev, rsrc->start, resource_size(rsrc));
    if (!addr) {
        dev_err(dev, "Couldn't map region\n");
        return -ENOMEM;
    }
    
    console_uio.mem[0].memtype = UIO_MEM_PHYS;
    console_uio.mem[0].addr = rsrc->start;
    console_uio.mem[0].size = resource_size(rsrc);
    console_uio.mem[0].name = "console_region";
    console_uio.mem[0].internal_addr = addr;
    
    res = uio_register_device(dev, &console_uio);
    if (res != 0) {
        dev_err(dev, "Couldn't register UIO device: %d\n", res);
    }
    
    return 0;
}

static int __exit pidp8_remove(struct platform_device *pdev) {
    uio_unregister_device(&console_uio);
    dev_info(&pdev->dev, "PiDP-8/I console driver removed\n");
    return 0;
}

static const struct of_device_id pidp8_of_ids[] = {
    { .compatible = "socdp8,console" },
    {},
};
MODULE_DEVICE_TABLE(of, pidp8_of_ids);

static struct platform_driver pidp8_platform_driver = {
    .probe = pidp8_probe,
    .remove = pidp8_remove,
    .driver = {
        .owner = THIS_MODULE,
        .name = "socdp8",
        .of_match_table = pidp8_of_ids
    }
};
module_platform_driver(pidp8_platform_driver);

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Folke Will <folko@solhost.org>");
MODULE_DESCRIPTION("Console driver for the PiDP-8/I console");
