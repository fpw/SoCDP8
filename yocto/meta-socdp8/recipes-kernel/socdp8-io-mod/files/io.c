#include <linux/module.h>
#include <linux/device.h>
#include <linux/platform_device.h>
#include <linux/of_platform.h>
#include <linux/io.h>
#include <linux/uio_driver.h>

static struct uio_info io_uio = {
    .name = "socdp8_io",
    .version = "0.1",
    .irq = UIO_IRQ_NONE,
};

static int __init io_probe(struct platform_device *pdev) {
    struct device *dev = &pdev->dev;
    struct resource *rsrc;
    void __iomem *addr;
    int res;
    
    dev_info(dev, "SoCDP8 I/O controller driver probed\n");
    
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
    
    io_uio.mem[0].memtype = UIO_MEM_PHYS;
    io_uio.mem[0].addr = rsrc->start;
    io_uio.mem[0].size = resource_size(rsrc);
    io_uio.mem[0].name = "io_region";
    io_uio.mem[0].internal_addr = addr;
    
    res = uio_register_device(dev, &io_uio);
    if (res != 0) {
        dev_err(dev, "Couldn't register UIO device: %d\n", res);
    }
        
    return 0;
}

static int __exit io_remove(struct platform_device *pdev) {
    uio_unregister_device(&io_uio);
    dev_info(&pdev->dev, "SoCDP8 I/O controller driver removed\n");
    return 0;
}

static const struct of_device_id io_of_ids[] = {
    { .compatible = "socdp8,io" },
    {},
};
MODULE_DEVICE_TABLE(of, io_of_ids);

static struct platform_driver io_platform_driver = {
    .probe = io_probe,
    .remove = io_remove,
    .driver = {
        .owner = THIS_MODULE,
        .name = "socdp8_io",
        .of_match_table = io_of_ids
    }
};
module_platform_driver(io_platform_driver);

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Folke Will <folko@solhost.org>");
MODULE_DESCRIPTION("I/O controller driver for the SoCDP8");
